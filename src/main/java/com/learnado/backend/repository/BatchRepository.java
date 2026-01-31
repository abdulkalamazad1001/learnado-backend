package com.learnado.backend.repository;

import com.learnado.backend.model.Batch;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface BatchRepository extends MongoRepository<Batch, String> {
    List<Batch> findByCourseId(String courseId);
}